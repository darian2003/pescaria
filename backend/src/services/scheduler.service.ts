import { DateTime } from "luxon"
import { generateReport } from "../controllers/reports.controller"
import { resetAllUmbrellas as resetUmbrellas } from "../controllers/umbrella.controller"

// Mock request and response objects for the controller functions
const createMockRequest = (body: any = {}) => ({
  body,
  user: { id: 1, role: "admin" }
})

const createMockResponse = () => {
  const res: any = {}
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (data: any) => {
    res.data = data
    return res
  }
  return res
}

// Main scheduler function that runs at midnight Romanian time
export const runMidnightReset = async () => {
  const now = DateTime.now().setZone("Europe/Bucharest")
  const yesterday = now.minus({ days: 1 }).toFormat("yyyy-MM-dd")
  
  console.log(`[SCHEDULER] Starting midnight reset process at ${now.toISO()}`)
  console.log(`[SCHEDULER] Generating report for yesterday: ${yesterday}`)
  
  try {
    // 1. Generate report for yesterday using existing controller function
    const req = createMockRequest({ date: yesterday })
    const res = createMockResponse()
    await generateReport(req as any, res as any)
    
    if (res.statusCode === 200) {
      console.log(`[SCHEDULER] Report generated successfully:`, res.data)
    } else {
      console.error(`[SCHEDULER] Failed to generate report:`, res.data)
    }
    
    // 2. Reset all umbrellas for the new day using existing controller function
    const resetReq = createMockRequest()
    const resetRes = createMockResponse()
    await resetUmbrellas(resetReq as any, resetRes as any)
    
    if (resetRes.statusCode === 200) {
      console.log(`[SCHEDULER] Umbrellas reset successfully:`, resetRes.data)
    } else {
      console.error(`[SCHEDULER] Failed to reset umbrellas:`, resetRes.data)
    }
    
    console.log(`[SCHEDULER] Midnight reset completed successfully`)
  } catch (err) {
    console.error(`[SCHEDULER] Error during midnight reset:`, err)
  }
}

// Function to schedule the midnight reset
export const scheduleMidnightReset = () => {
  const scheduleNextMidnight = () => {
    const now = DateTime.now().setZone("Europe/Bucharest")
    const tomorrow = now.plus({ days: 1 }).startOf("day")
    const timeUntilMidnight = tomorrow.diff(now).as("milliseconds")
    
    console.log(`[SCHEDULER] Next reset scheduled for ${tomorrow.toISO()} (in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes)`)
    
    setTimeout(async () => {
      await runMidnightReset()
      // Schedule the next midnight reset
      scheduleNextMidnight()
    }, timeUntilMidnight)
  }
  
  // Schedule the first midnight reset
  scheduleNextMidnight()
  
  // Log current time for debugging
  const now = DateTime.now().setZone("Europe/Bucharest")
  console.log(`[SCHEDULER] Current Romanian time: ${now.toISO()}`)
  console.log(`[SCHEDULER] Scheduler initialized successfully`)
}

// Function to manually trigger the reset (for testing)
export const manualMidnightReset = async () => {
  console.log("[SCHEDULER] Manual midnight reset triggered")
  await runMidnightReset()
} 