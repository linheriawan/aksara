# Aksara Platform - Frontend

Fast API & UI Generator Platform built with SvelteKit and Bun.

## Quick Start

### Prerequisites

- **Bun** runtime installed
- **MongoDB** Atlas account or local MongoDB instance
- **Node.js** 18+ (optional, for compatibility)

### Installation

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB connection string
```

### Initial Setup

1. **Configure MongoDB**: Update `MONGODB_URL` and `MONGODB_DB` in `.env`

2. **Initialize Platform**: Run once to set up database, roles, and admin user

```bash
# Start dev server
bun run dev

# In another terminal, initialize the platform
curl -X POST http://localhost:3000/api/init
```

This will create:
- Default roles (admin, developer, viewer)
- Default admin user (admin@aksara.local / admin123)
- Database indexes

3. **Login**: Navigate to http://localhost:3000/login

Default credentials:
- Email: `admin@aksara.local`
- Password: `admin123`

## Development

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run check
```

## Project Structure

```
src/
├── lib/
│   ├── components/          # Svelte components
│   ├── server/              # Server-side modules
│   │   ├── database/        # MongoDB connection
│   │   ├── security/        # Auth, JWT, RBAC
│   │   └── modules/         # Business logic modules
│   └── types.ts             # TypeScript types
├── routes/
│   ├── +layout.svelte       # Main layout
│   ├── +page.svelte         # Dashboard
│   ├── login/               # Login page
│   └── api/                 # API endpoints
└── hooks.server.ts          # Authentication middleware
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

```env
# Database
MONGODB_URL=mongodb+srv://[username]:[password]@[cluster.mongodb.net]/
MONGODB_DB=aksaraIS

# Authentication
JWT_SECRET=your_secret_key_change_in_production
SESSION_COOKIE_NAME=session
SESSION_MAX_AGE=86400
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/health` - Health check

### Initialization

- `POST /api/init` - Initialize platform (run once)

## Phase 1 Features ✅

**Completed:**
- SvelteKit + Bun setup
- MongoDB connection with pooling
- JWT-based authentication
- RBAC system with roles and permissions
- Login/logout functionality
- Health check endpoint
- Main layout with navigation
- Database initialization script

## Next Steps

**Phase 2:** Datasource Module
- Connect to MySQL, PostgreSQL, MongoDB
- Schema discovery
- API connector for REST endpoints

**Phase 3:** Object Mapping Module
- Define business objects
- Map fields to datasources
- Data transformation engine

**Phase 4+:** API Publishing, UI Generation, and more

## Technology Stack

- **Runtime:** Bun
- **Framework:** SvelteKit 2+
- **Database:** MongoDB Atlas
- **Authentication:** JWT + bcrypt
- **TypeScript:** Full type safety
- **CSS:** Tailwind (to be added)

## Security

- Passwords hashed with bcrypt
- JWT tokens for session management
- HTTP-only cookies
- RBAC authorization
- Audit logging (Phase 9)

## Troubleshooting

### MongoDB Connection Error

Ensure your IP is whitelisted in MongoDB Atlas and connection string is correct.

### Can't login

Run the initialization endpoint first:
```bash
curl -X POST http://localhost:3000/api/init
```

### Port already in use

Change the `PORT` in `.env` file.

## Documentation

- Main project docs: `../docs/`
- Architecture: See SAD-*.md files in `../docs/`

## License

Private project for Aksara Initiatives

---

**Generated with ❤️ by Aksara Platform Team**
