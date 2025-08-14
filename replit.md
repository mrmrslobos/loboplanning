# Overview

LoboHub is a comprehensive family hub web application built with a modern full-stack architecture. The application serves as a centralized digital platform for families to manage tasks, lists, calendars, budgets, meal planning, devotionals, events, and real-time chat communication. The system implements a sophisticated family-based sharing model where content can be either private to individual users or shared across family members.

## Recent Changes (August 2025)

### Enhanced Devotional Module
- **Complete redesign** of the devotional page with modern tabbed interface
- **Daily inspirational verses** - Rotating pool of 15 carefully selected Bible verses that change daily
- **"Reflect on This" feature** - One-click button to create personal reflections based on daily verses
- **Separated content types** with dedicated tabs:
  - **Reflections Tab**: Personal spiritual insights and verse-based thoughts (marked with 🌟)
  - **Prayer Requests Tab**: Family prayer needs and spiritual support requests (marked with 🙏)
  - **Devotionals Tab**: Traditional structured devotional posts with readings, questions, and prayers
- **Visual enhancements**: Gradient cards, themed icons, and improved spacing
- **Smart filtering**: Each tab shows only relevant content with accurate counts
- **Private/Shared toggle**: All content types support individual privacy settings
- **Pre-filled reflection forms**: Daily verse automatically populates reflection content for easy spiritual journaling

### Comprehensive Calendar Module
- **Monthly calendar view** displaying events and tasks with due dates
- **Color-coded items** by type (events in blue, tasks by status)
- **Direct event creation** by clicking any calendar date
- **Integration with Tasks and Events** systems for unified scheduling
- **Navigation controls** for browsing months with today highlighting
- **Visual legend** for understanding different item types and colors

### Advanced Budget Module
- **Complete financial tracking** with income and expense categories
- **Monthly summaries** showing total income, expenses, and net income
- **Visual spending breakdown** by category with progress bars and percentages
- **Budget limits** with over-budget alerts and warnings
- **Transaction management** with full CRUD operations and category assignment
- **Color-coded categories** for easy visual identification
- **Tabbed interface** for Overview, Transactions, Categories, and Analytics
- **Private/shared transactions** supporting family budgeting workflows

### Comprehensive Meal Planning Module
- **Weekly meal planner** with breakfast, lunch, and dinner slots for each day
- **Recipe management** with custom recipe creation and Mealie integration support
- **Drag-and-drop functionality** for intuitive meal assignment from recipe collection
- **Custom meal support** allowing freeform meal entries alongside recipes
- **Saved meal plans** for future reuse and planning efficiency
- **Recipe collection** with difficulty levels, prep times, servings, and cuisine types
- **Week navigation** with ability to save and load different weekly plans
- **Smart meal selection** with both recipe and custom meal options
- **Mealie API integration** for importing recipes from self-hosted Mealie instances
- **Connection testing** and settings management for Mealie instances
- **Bulk recipe sync** with duplicate prevention and progress tracking
- **Recipe format conversion** from Mealie's schema to internal format

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket integration for live chat functionality

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API architecture with standardized JSON responses
- **Authentication**: JWT-based authentication with token storage
- **Session Management**: Express sessions with PostgreSQL session store
- **Real-time Features**: WebSocket server for chat functionality
- **File Structure**: Monorepo structure with shared schema definitions

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts`
- **Migration Strategy**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless PostgreSQL

## Core Data Models

### User and Family System
- **Users Table**: Stores user credentials and family associations
- **Families Table**: Contains family information and unique invite codes
- **Privacy Model**: Content includes `user_id` (owner) and optional `family_id` (shared scope)
  - `family_id = null`: Private content visible only to the user
  - `family_id = value`: Shared content visible to all family members

### Feature Modules
- **Tasks**: Task management with priority, status, and assignment capabilities
- **Lists**: Shopping lists and general list management with items
- **Calendar Events**: Event scheduling with time, location, and participant tracking
- **Budget**: Financial tracking with categories and transactions
- **Chat**: Real-time messaging system for family communication
- **Devotional**: Religious content sharing with posts and comments
- **Events**: Special event planning with guest lists, checklists, and budgets
- **Meal Planning**: Integration-ready meal planning system

## Authentication & Authorization
- **Registration/Login**: Email and password-based authentication
- **Token Management**: JWT tokens for API authentication
- **Family Access Control**: Automatic filtering of content based on family membership
- **Session Persistence**: Secure session management with HTTP-only cookies

## Real-time Features
- **WebSocket Implementation**: Real-time chat functionality
- **Connection Management**: Online user tracking and connection state management
- **Message Broadcasting**: Family-scoped message distribution

## Development Architecture
- **Build System**: Vite for frontend, ESBuild for backend production builds
- **Type Safety**: Shared TypeScript interfaces between frontend and backend
- **Code Organization**: Feature-based directory structure with shared utilities
- **Development Server**: Hot reload support with Vite middleware integration

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: TypeScript-first ORM for database operations
- **Express.js**: Web application framework for the backend API

## Frontend Libraries
- **React Ecosystem**: React 18 with TypeScript and modern hooks
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives for the UI system
- **Tailwind CSS**: Utility-first CSS framework for styling

## Authentication & Security
- **bcrypt**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and verification
- **connect-pg-simple**: PostgreSQL session store for Express

## Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time features

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking across the entire application
- **Replit Integration**: Development environment support with error overlay

## Potential Integrations
- **Mealie API**: Meal planning system integration (configured but not fully implemented)
- **External Calendar Systems**: Calendar synchronization capabilities
- **Third-party Authentication**: OAuth provider integration ready