# Overview

LoboHub is a comprehensive family hub web application providing a centralized digital platform for families to manage tasks, lists, calendars, budgets, meal planning, devotionals, events, and real-time chat. It implements a sophisticated family-based sharing model where content can be private or shared among family members, aiming to streamline family organization and communication.

## Recent Major Features Added

### React Native Mobile App (August 2025)
- **Complete Native Mobile Version**: Full React Native implementation with Material Design UI using React Native Paper
- **Native Performance**: True native navigation, gestures, and components for superior mobile experience
- **Cross-Platform Compatibility**: Single codebase supporting both Android and iOS with platform-specific optimizations
- **Enhanced Mobile Features**: Voice input framework, push notifications support, secure credential storage, and offline-ready architecture
- **API Integration**: Uses same Express.js backend as web version with identical authentication and data synchronization
- **Native UI Components**: Bottom tab navigation, floating action buttons, modals, and Material Design theming
- **Mobile-Optimized Screens**: Dashboard, Tasks, Lists, Budget, and AI Assistant all redesigned for touch interaction
- **Development Ready**: Complete Expo setup with development server, building pipeline, and deployment configuration

### Advanced AI-Powered Task Recommendation Engine (August 2025)
- **Personalized AI Recommendations**: Comprehensive task recommendation system using Gemini 2.5 Pro with deep personalization based on user behavior patterns, completion history, and contextual factors
- **User Behavior Analysis**: Advanced AI analyzer that learns user productivity patterns, energy levels, focus patterns, motivational factors, and optimal task sequencing
- **Contextual Intelligence**: Real-time recommendations based on time of day, day of week, family collaboration opportunities, and current energy/focus levels
- **Family Collaboration Integration**: AI considers family task patterns and suggests collaborative opportunities
- **Enhanced Frontend Components**: 
  - PersonalizedInsights component showing productivity patterns, peak hours, and motivational factors
  - ContextualRecommendations component providing real-time productivity tips and energy/focus level indicators
  - Enhanced TaskRecommendations with personalization scores, motivation triggers, suggested subtasks, and collaboration opportunities

### Comprehensive Achievement System (August 2025)
- **PostgreSQL-Based Achievement Tracking**: Complete gamification system with 22 achievement badges across 5 categories
- **Family Leveling System**: Points-based progression system where families level up together through task completion
- **Real-Time Achievement Notifications**: Instant feedback when achievements are unlocked during task completion
- **Achievement Categories**: Task completion, collaboration, milestones, consistency, and special achievements

### Cross-Feature AI Integration (August 2025)
- **AI Meal Planning**: Smart meal recommendations considering calendar events, budget constraints, dietary preferences, and family size
- **AI Budget Advisor**: Intelligent financial analysis with calendar integration, bill due date tracking, spending pattern recognition, and cash flow optimization
- **AI Calendar Insights**: Cross-feature scheduling intelligence that considers tasks, meals, budget obligations, and family events
- **Smart Integrations**: Meal planning considers budget constraints and busy calendar days; budget analysis factors in calendar events and meal costs; calendar insights optimize timing for all family activities
- **Real-Time Intelligence**: AI adapts recommendations based on current family context, energy levels, time constraints, and financial status

### AI-Powered Event Management (August 2025)
- **Intelligent Event Planning**: AI automatically generates comprehensive event plans for birthdays, parties, and special occasions
- **Automated Task Creation**: Smart generation of relevant tasks, shopping lists, and preparation timelines for any event type
- **Budget-Aware Planning**: Event suggestions consider family budget constraints and provide cost breakdowns
- **Timeline Optimization**: AI creates detailed preparation schedules with appropriate lead times for bookings and purchases
- **Family Collaboration**: Event planning tasks are designed for family participation and role assignment
- **Emergency Planning**: Includes contingency plans and quick suggestions for last-minute events

### AI-Powered Devotional System (August 2025)
- **Intelligent Daily Devotionals**: AI generates personalized daily devotionals with Bible verses, reflections, prayers, and family activities
- **Theme-Based Content**: Specialized devotionals for marriage, parenting, family life, children's faith, and relationships
- **Weekly Devotional Plans**: Comprehensive 7-day devotional journeys with cohesive themes and memory verses
- **Topical Devotionals**: On-demand devotionals for specific topics like forgiveness, patience, trust, and communication
- **Family-Centered Approach**: Content tailored to family size, children's ages, marriage years, and specific spiritual needs
- **Practical Application**: Each devotional includes actionable steps, discussion questions, and family activities
- **Scripture Integration**: Accurate Bible verses with proper references using ESV (English Standard Version)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Web Framework**: React with TypeScript (Vite)
- **Mobile Framework**: React Native with Expo and TypeScript
- **Web UI Library**: Shadcn/ui (built on Radix UI)
- **Mobile UI Library**: React Native Paper (Material Design)
- **Web Styling**: Tailwind CSS with CSS variables
- **Mobile Styling**: React Native Paper theming system
- **State Management**: TanStack Query (both web and mobile)
- **Web Routing**: Wouter
- **Mobile Navigation**: React Navigation with bottom tabs
- **Real-time**: WebSocket integration (web), push notifications ready (mobile)

## Backend Architecture
- **Framework**: Express.js with TypeScript (Node.js)
- **API Design**: RESTful API (JSON responses)
- **Authentication**: JWT-based
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time**: WebSocket server
- **File Structure**: Monorepo with shared schema definitions

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Centralized definitions in `/shared/schema.ts`
- **Migration Strategy**: Drizzle Kit
- **Connection**: Standard `pg` driver with SSL support

## Core Data Models
- **User and Family System**: Users and Families tables with invite codes. Content privacy (`user_id` for owner, `family_id` for shared scope).
- **Feature Modules**: Tasks, Lists, Calendar Events, Budget, Chat, Devotional, Events, Meal Planning.

## Authentication & Authorization
- **Registration/Login**: Email/password
- **Token Management**: JWT tokens
- **Family Access Control**: Content filtered by family membership
- **Session Persistence**: Secure HTTP-only cookies

## Real-time Features
- **WebSocket Implementation**: Real-time chat, online user tracking, family-scoped message distribution.

## Development Architecture
- **Build System**: Vite (frontend), ESBuild (backend)
- **Type Safety**: Shared TypeScript interfaces
- **Code Organization**: Feature-based directory structure
- **Development Server**: Hot reload with Vite middleware

# External Dependencies

## Core Infrastructure
- **PostgreSQL**: Relational database
- **Drizzle ORM**: TypeScript ORM
- **Express.js**: Backend web framework

## Frontend Libraries
- **React Ecosystem**: React, TypeScript
- **TanStack Query**: Server state management
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Styling framework

## Authentication & Security
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT handling
- **connect-pg-simple**: PostgreSQL session store

## Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation

## Development Tools
- **Vite**: Frontend build tool
- **TypeScript**: Static type checking

## Integrations
- **Mealie API**: For meal planning system integration.