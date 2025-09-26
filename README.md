# Wizytowka

Personal portfolio website with contact functionality built with Next.js and NestJS.

## Description

A full-stack web application featuring a personal portfolio website with contact form functionality. The frontend is built with Next.js 15, React 18, and TypeScript, while the backend uses NestJS with Prisma ORM for database management. The application supports internationalization and includes modern web development practices.

## Getting Started

### Dependencies

* Node.js 18+
* npm, yarn, or pnpm package manager
* Docker and Docker Compose (optional)
* Kubernetes cluster (optional)
* PostgreSQL database (optional)

### Installing

* Clone the repository: `git clone <repository-url>`
* Install frontend dependencies: `cd frontend && npm install`
* Install backend dependencies: `cd backend && npm install`
* Configure environment variables in `.env` files
* Set up the database: `cd backend && npx prisma migrate dev`

### Executing program

* Start the backend server: `cd backend && npm run start:dev`
* Start the frontend development server: `cd frontend && npm run dev`
* Open browser and navigate to `http://localhost:3000`
```
cd backend && npm run start:dev
cd frontend && npm run dev
```

## Help

For common issues:
* Check if all dependencies are installed: `npm install`
* Verify environment variables are properly configured
* Check database connectivity: `npx prisma db push`
* View application logs for detailed error information
```
npm run help
```

## Version History

* 0.1
    * Initial Release


## Acknowledgments

* Next.js framework
* NestJS framework
* Prisma ORM
* TypeScript team
* React team
* Tailwind CSS