# Overview

LoboHub is a comprehensive family hub web application providing a centralized digital platform for families to manage tasks, lists, calendars, budgets, meal planning, devotionals, events, and real-time chat. It implements a sophisticated family-based sharing model where content can be private or shared among family members, aiming to streamline family organization and communication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript (Vite)
- **UI Library**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Real-time**: WebSocket integration

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