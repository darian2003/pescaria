# Beach Bar Management System

A comprehensive beach bar management system with automatic daily reports and midnight reset functionality.

## Features

### Automatic Midnight Reset
The system automatically generates daily reports and resets the beach at midnight Romanian time (Europe/Bucharest timezone). This includes:

1. **Daily Report Generation**: Automatically generates a comprehensive report for the previous day including:
   - Total beach rentals
   - Total hotel rentals  
   - Total earnings
   - Staff statistics
   - Extra beds data

2. **Beach Reset**: Resets all umbrellas and beds for the new day:
   - Clears all beach rentals
   - Resets hotel beds to their default state
   - Clears all rental transactions
   - Resets extra beds count to 0



### Timezone
All scheduling is done in Romanian time (Europe/Bucharest timezone) to ensure accurate daily resets.

## Technical Details

The scheduler service (`backend/src/services/scheduler.service.ts`) reuses existing controller functions to ensure consistency and maintainability. 
