# Test Data Creation for Comprehensive QA Testing

## Test User Profile
- Email: test@family.com  
- Password: TestPass123
- Family: BLUE-OCEAN-42

## Test Data Categories

### 1. Tasks Module
- High Priority Task: "Fix leaky faucet" (due tomorrow)
- Medium Priority: "Grocery shopping" (due this weekend)
- Low Priority: "Plan summer vacation" (due next month)
- Completed Task: "Take out trash"

### 2. Lists Module  
- Shopping List: ["Milk", "Bread", "Eggs", "Apples"]
- Todo List: ["Call dentist", "Pay bills", "Clean garage"]
- Vacation Packing: ["Sunscreen", "Camera", "Books"]

### 3. Events Module
- Birthday Party: Sarah's 10th birthday (next Saturday)
- Family Reunion: Annual gathering (next month)
- Movie Night: Weekly family time (Friday)

### 4. Budget Module
**Categories:**
- Income: Salary ($5000), Freelance ($1200)  
- Expenses: Groceries ($600), Gas ($300), Entertainment ($200)

**Transactions:**
- Salary deposit: +$5000
- Grocery store: -$150  
- Gas station: -$75
- Movie tickets: -$45

### 5. Calendar Events
- Doctor appointment (Tuesday 2pm)
- School meeting (Thursday 6pm)
- Weekend trip (Saturday-Sunday)

### 6. Chat Messages
- "Good morning family!"
- "Don't forget the soccer game at 3pm"
- "Who wants pizza for dinner?"

### 7. Devotional Posts
- Daily reflection on gratitude
- Prayer request for health
- Bible study notes on Psalm 23

### 8. Meal Planning
- Monday: Chicken dinner, Salad lunch, Cereal breakfast
- Tuesday: Pasta night, Sandwiches, Oatmeal
- Recipe collection: "Family Pasta", "Chicken Stir-fry", "Pancakes"

## Testing Scenarios

### Scenario 1: New Family Setup
1. Register new user
2. Create family with invite code
3. Add initial tasks, lists, and events
4. Set up budget categories
5. Test all basic CRUD operations

### Scenario 2: Family Collaboration
1. Add family member with invite code
2. Share tasks and lists  
3. Test real-time chat
4. Create shared budget transactions
5. Plan meals together

### Scenario 3: Advanced Features
1. Test emoji reactions on all content
2. Use threaded comments in devotional
3. Import recipes from Mealie
4. Generate budget analytics
5. Test calendar integration

## Success Criteria
✅ All forms validate properly
✅ All CRUD operations work
✅ Real-time features function
✅ Privacy settings respected
✅ Mobile responsive design
✅ No console errors
✅ Fast load times
✅ Data persists correctly