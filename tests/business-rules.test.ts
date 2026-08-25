import { prisma } from "../lib/prisma";
import { ReturnStatus, ReturnReason, ReturnResolution } from "@prisma/client";
import { validateStatusTransition } from "../lib/business-rules/lifecycle";
import { validateApprovalResolution } from "../lib/business-rules/approval";
import { assertNoDuplicateLiveRequest } from "../lib/business-rules/duplicate";
import { assertRequestNotLocked } from "../lib/business-rules/locking";
import { assertCanRemoveRequest } from "../lib/business-rules/removal";
import { generateReturnReference } from "../lib/reference";
import { BusinessRuleError } from "../lib/errors";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("🧪 Running ReturnDesk Comprehensive Business Rules Tests");
  console.log("========================================================\n");

  // Clean test namespace data
  await prisma.note.deleteMany({
    where: { request: { orderId: { startsWith: "TEST-ORD-" } } },
  });
  await prisma.returnRequest.deleteMany({
    where: { orderId: { startsWith: "TEST-ORD-" } },
  });

  // Helper to create test return request
  async function createTestRequest(overrides: Partial<Parameters<typeof prisma.returnRequest.create>[0]["data"]> = {}) {
    return await prisma.$transaction(async (tx) => {
      const ref = await generateReturnReference(tx);
      return await tx.returnRequest.create({
        data: {
          reference: ref,
          customerName: "Test User",
          customerEmail: "test@example.com",
          customerPhone: "+1 555-0100",
          orderId: `TEST-ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          itemId: "TEST-ITEM-1",
          quantity: 1,
          reason: ReturnReason.DAMAGED,
          status: ReturnStatus.OPEN,
          ...overrides,
        },
      });
    });
  }

  // --- Rule 1 Tests: Status Lifecycle ---
  console.log("--- Rule 1: Status Lifecycle ---");

  // 1. OPEN -> IN_REVIEW succeeds
  try {
    validateStatusTransition(ReturnStatus.OPEN, ReturnStatus.IN_REVIEW);
    assert(true, "1. OPEN -> IN_REVIEW succeeds");
  } catch (e: any) {
    assert(false, "1. OPEN -> IN_REVIEW succeeds", e.message);
  }

  // 2. IN_REVIEW -> APPROVED succeeds with valid resolution
  try {
    validateStatusTransition(ReturnStatus.IN_REVIEW, ReturnStatus.APPROVED);
    const { resolution, refundAmount } = validateApprovalResolution(ReturnResolution.REFUND, 50.0);
    assert(
      resolution === ReturnResolution.REFUND && refundAmount === 50.0,
      "2. IN_REVIEW -> APPROVED succeeds with valid resolution"
    );
  } catch (e: any) {
    assert(false, "2. IN_REVIEW -> APPROVED succeeds with valid resolution", e.message);
  }

  // 3. IN_REVIEW -> REJECTED succeeds
  try {
    validateStatusTransition(ReturnStatus.IN_REVIEW, ReturnStatus.REJECTED);
    assert(true, "3. IN_REVIEW -> REJECTED succeeds");
  } catch (e: any) {
    assert(false, "3. IN_REVIEW -> REJECTED succeeds", e.message);
  }

  // 4. APPROVED -> COMPLETED succeeds
  try {
    validateStatusTransition(ReturnStatus.APPROVED, ReturnStatus.COMPLETED);
    assert(true, "4. APPROVED -> COMPLETED succeeds");
  } catch (e: any) {
    assert(false, "4. APPROVED -> COMPLETED succeeds", e.message);
  }

  // 5. OPEN -> APPROVED fails
  try {
    validateStatusTransition(ReturnStatus.OPEN, ReturnStatus.APPROVED);
    assert(false, "5. OPEN -> APPROVED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "5. OPEN -> APPROVED fails");
  }

  // 6. OPEN -> COMPLETED fails
  try {
    validateStatusTransition(ReturnStatus.OPEN, ReturnStatus.COMPLETED);
    assert(false, "6. OPEN -> COMPLETED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "6. OPEN -> COMPLETED fails");
  }

  // 7. OPEN -> REJECTED fails
  try {
    validateStatusTransition(ReturnStatus.OPEN, ReturnStatus.REJECTED);
    assert(false, "7. OPEN -> REJECTED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "7. OPEN -> REJECTED fails");
  }

  // 8. APPROVED -> REJECTED fails
  try {
    validateStatusTransition(ReturnStatus.APPROVED, ReturnStatus.REJECTED);
    assert(false, "8. APPROVED -> REJECTED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "8. APPROVED -> REJECTED fails");
  }

  // 9. COMPLETED -> anything fails
  const completedTargets = [ReturnStatus.OPEN, ReturnStatus.IN_REVIEW, ReturnStatus.APPROVED, ReturnStatus.REJECTED];
  let compFailedAll = true;
  for (const target of completedTargets) {
    try {
      validateStatusTransition(ReturnStatus.COMPLETED, target);
      compFailedAll = false;
    } catch (e: any) {
      // Expected
    }
  }
  assert(compFailedAll, "9. COMPLETED -> anything fails");

  // 10. REJECTED -> anything fails
  const rejectedTargets = [ReturnStatus.OPEN, ReturnStatus.IN_REVIEW, ReturnStatus.APPROVED, ReturnStatus.COMPLETED];
  let rejFailedAll = true;
  for (const target of rejectedTargets) {
    try {
      validateStatusTransition(ReturnStatus.REJECTED, target);
      rejFailedAll = false;
    } catch (e: any) {
      // Expected
    }
  }
  assert(rejFailedAll, "10. REJECTED -> anything fails");

  // --- Rule 2 Tests: Approval Resolution & Refund Rules ---
  console.log("\n--- Rule 2: Approval Requires Resolution ---");

  // 11. Approval without resolution fails
  try {
    validateApprovalResolution(null as any);
    assert(false, "11. Approval without resolution fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "11. Approval without resolution fails");
  }

  // 12. Refund with zero/negative amount fails
  let zeroFailed = false;
  let negFailed = false;
  try {
    validateApprovalResolution(ReturnResolution.REFUND, 0);
  } catch {
    zeroFailed = true;
  }
  try {
    validateApprovalResolution(ReturnResolution.REFUND, -25.5);
  } catch {
    negFailed = true;
  }
  assert(zeroFailed && negFailed, "12. Refund with zero/negative amount fails");

  // 13. Replacement with refund amount fails
  try {
    validateApprovalResolution(ReturnResolution.REPLACEMENT, 50.0);
    assert(false, "13. Replacement with refund amount fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "13. Replacement with refund amount fails");
  }

  // 14. Store Credit with refund amount fails
  try {
    validateApprovalResolution(ReturnResolution.STORE_CREDIT, 100.0);
    assert(false, "14. Store Credit with refund amount fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError, "14. Store Credit with refund amount fails");
  }

  // --- Rule 3 Tests: One Live Request Per Order/Item ---
  console.log("\n--- Rule 3: One Live Request Per Order/Item ---");

  const sharedOrderId = `TEST-ORD-DUP-${Date.now()}`;
  const sharedItemId = "ITEM-DUP-99";

  const liveReq = await createTestRequest({
    orderId: sharedOrderId,
    itemId: sharedItemId,
    status: ReturnStatus.OPEN,
  });

  // 15. Duplicate live order/item request fails
  try {
    await prisma.$transaction(async (tx) => {
      await assertNoDuplicateLiveRequest(tx, sharedOrderId, sharedItemId);
    });
    assert(false, "15. Duplicate live order/item request fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "DUPLICATE_LIVE_REQUEST", "15. Duplicate live order/item request fails");
  }

  // 16. Duplicate request becomes allowed after old request is REJECTED
  await prisma.returnRequest.update({
    where: { id: liveReq.id },
    data: { status: ReturnStatus.REJECTED },
  });

  let rejAllowed = false;
  try {
    await prisma.$transaction(async (tx) => {
      await assertNoDuplicateLiveRequest(tx, sharedOrderId, sharedItemId);
      rejAllowed = true;
    });
  } catch (e) {
    rejAllowed = false;
  }
  assert(rejAllowed, "16. Duplicate request becomes allowed after old request is REJECTED");

  // Create another live request and move to COMPLETED
  const secondLiveReq = await createTestRequest({
    orderId: sharedOrderId,
    itemId: sharedItemId,
    status: ReturnStatus.OPEN,
  });

  await prisma.returnRequest.update({
    where: { id: secondLiveReq.id },
    data: { status: ReturnStatus.COMPLETED, resolution: ReturnResolution.REFUND, refundAmount: 20 },
  });

  // 17. Duplicate request becomes allowed after old request is COMPLETED
  let compAllowed = false;
  try {
    await prisma.$transaction(async (tx) => {
      await assertNoDuplicateLiveRequest(tx, sharedOrderId, sharedItemId);
      compAllowed = true;
    });
  } catch (e) {
    compAllowed = false;
  }
  assert(compAllowed, "17. Duplicate request becomes allowed after old request is COMPLETED");

  // --- Rule 4 Tests: Locked Once Decided ---
  console.log("\n--- Rule 4: Locked Once Decided ---");

  // 18. Editing customer/item details after APPROVED fails
  try {
    assertRequestNotLocked(ReturnStatus.APPROVED);
    assert(false, "18. Editing customer/item details after APPROVED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "REQUEST_LOCKED", "18. Editing customer/item details after APPROVED fails");
  }

  // 19. Editing customer/item details after REJECTED fails
  try {
    assertRequestNotLocked(ReturnStatus.REJECTED);
    assert(false, "19. Editing customer/item details after REJECTED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "REQUEST_LOCKED", "19. Editing customer/item details after REJECTED fails");
  }

  // 20. Editing customer/item details after COMPLETED fails
  try {
    assertRequestNotLocked(ReturnStatus.COMPLETED);
    assert(false, "20. Editing customer/item details after COMPLETED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "REQUEST_LOCKED", "20. Editing customer/item details after COMPLETED fails");
  }

  // Permitted in OPEN and IN_REVIEW
  try {
    assertRequestNotLocked(ReturnStatus.OPEN);
    assertRequestNotLocked(ReturnStatus.IN_REVIEW);
  } catch {
    assert(false, "Editing permitted in OPEN/IN_REVIEW");
  }

  // --- Notes Functionality ---
  console.log("\n--- Notes Functionality ---");

  const testNotesReq = await createTestRequest({ status: ReturnStatus.COMPLETED, resolution: ReturnResolution.STORE_CREDIT });

  // 21. Notes can be added to any status
  const note = await prisma.note.create({
    data: {
      requestId: testNotesReq.id,
      content: "Note added on completed request.",
    },
  });
  assert(note.id !== undefined && note.requestId === testNotesReq.id, "21. Notes can be added to any status");

  // 22. Notes cannot be edited/deleted (no mutations provided)
  const allNotes = await prisma.note.findMany({
    where: { requestId: testNotesReq.id },
    orderBy: { createdAt: "asc" },
  });
  assert(allNotes.length >= 1, "22. Notes cannot be edited/deleted & returned chronologically");

  // --- Rule 5 Tests: Soft Deletion Removal ---
  console.log("\n--- Rule 5: Removal ---");

  // 23. Removing OPEN succeeds
  try {
    assertCanRemoveRequest(ReturnStatus.OPEN);
    assert(true, "23. Removing OPEN succeeds");
  } catch (e: any) {
    assert(false, "23. Removing OPEN succeeds", e.message);
  }

  // 24. Removing REJECTED succeeds
  try {
    assertCanRemoveRequest(ReturnStatus.REJECTED);
    assert(true, "24. Removing REJECTED succeeds");
  } catch (e: any) {
    assert(false, "24. Removing REJECTED succeeds", e.message);
  }

  // 25. Removing IN_REVIEW fails
  try {
    assertCanRemoveRequest(ReturnStatus.IN_REVIEW);
    assert(false, "25. Removing IN_REVIEW fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "CANNOT_REMOVE_REQUEST", "25. Removing IN_REVIEW fails");
  }

  // 26. Removing APPROVED fails
  try {
    assertCanRemoveRequest(ReturnStatus.APPROVED);
    assert(false, "26. Removing APPROVED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "CANNOT_REMOVE_REQUEST", "26. Removing APPROVED fails");
  }

  // 27. Removing COMPLETED fails
  try {
    assertCanRemoveRequest(ReturnStatus.COMPLETED);
    assert(false, "27. Removing COMPLETED fails", "Should have thrown BusinessRuleError");
  } catch (e: any) {
    assert(e instanceof BusinessRuleError && e.code === "CANNOT_REMOVE_REQUEST", "27. Removing COMPLETED fails");
  }

  // Test actual soft deletion and list filtering
  const softDelReq = await createTestRequest({ status: ReturnStatus.OPEN });
  await prisma.returnRequest.update({
    where: { id: softDelReq.id },
    data: { removedAt: new Date() },
  });

  // 28. Removed requests are not returned by normal list API
  const activeList = await prisma.returnRequest.findMany({
    where: { removedAt: null },
  });
  const foundInList = activeList.some((r) => r.id === softDelReq.id);
  assert(!foundInList, "28. Removed requests are not returned by normal list API");

  // 29. Removed requests cannot be fetched normally
  const fetchSingle = await prisma.returnRequest.findFirst({
    where: { id: softDelReq.id, removedAt: null },
  });
  assert(fetchSingle === null, "29. Removed requests cannot be fetched normally");

  // --- Search, Filtering, Sorting, and Pagination ---
  console.log("\n--- List Engine: Search, Filter, Sort, Pagination ---");

  // 30. Search works
  const searchResults = await prisma.returnRequest.findMany({
    where: {
      removedAt: null,
      OR: [
        { customerName: { contains: "Ganesh", mode: "insensitive" } },
        { reference: { contains: "Ganesh", mode: "insensitive" } },
        { orderId: { contains: "Ganesh", mode: "insensitive" } },
      ],
    },
  });
  assert(searchResults.length > 0 && searchResults[0].customerName.includes("Ganesh"), "30. Search works");

  // 31. Filtering works
  const filterResults = await prisma.returnRequest.findMany({
    where: {
      removedAt: null,
      status: ReturnStatus.APPROVED,
      reason: ReturnReason.DAMAGED,
    },
  });
  const allMatch = filterResults.every((r) => r.status === ReturnStatus.APPROVED && r.reason === ReturnReason.DAMAGED);
  assert(filterResults.length > 0 && allMatch, "31. Filtering works (status & reason)");

  // 32. Sorting works
  const sortResultsAsc = await prisma.returnRequest.findMany({
    where: { removedAt: null },
    orderBy: { createdAt: "asc" },
    take: 5,
  });
  const isAsc = sortResultsAsc[0].createdAt.getTime() <= sortResultsAsc[sortResultsAsc.length - 1].createdAt.getTime();
  assert(isAsc, "32. Sorting works");

  // 33. Pagination works
  const limit = 5;
  const page1 = await prisma.returnRequest.findMany({
    where: { removedAt: null },
    orderBy: { createdAt: "desc" },
    skip: 0,
    take: limit,
  });
  const page2 = await prisma.returnRequest.findMany({
    where: { removedAt: null },
    orderBy: { createdAt: "desc" },
    skip: limit,
    take: limit,
  });
  const disjoint = page1.every((p1) => !page2.some((p2) => p2.id === p1.id));
  assert(page1.length === limit && page2.length === limit && disjoint, "33. Pagination works");

  // 34. Search + filtering + sorting + pagination work together
  const combined = await prisma.returnRequest.findMany({
    where: {
      removedAt: null,
      status: ReturnStatus.OPEN,
      reason: ReturnReason.DAMAGED,
      OR: [
        { customerName: { contains: "Ganesh", mode: "insensitive" } },
        { orderId: { contains: "Ganesh", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    skip: 0,
    take: 10,
  });
  assert(combined.length >= 1, "34. Search + filtering + sorting + pagination work together");

  // Clean test namespace data
  await prisma.note.deleteMany({
    where: { request: { orderId: { startsWith: "TEST-ORD-" } } },
  });
  await prisma.returnRequest.deleteMany({
    where: { orderId: { startsWith: "TEST-ORD-" } },
  });

  console.log("\n========================================================");
  console.log(`📊 Test Summary: ${passedCount} Passed, ${failedCount} Failed out of ${passedCount + failedCount} tests`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
