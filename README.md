# InstallSure - Insurance Management Application

A modern, full-featured insurance management application built with React, TypeScript, and Vite.

## Features

### 🔐 User Authentication
- Simple login system for demo purposes
- Secure session management with Zustand state management

### 📊 Dashboard
- Overview of insurance portfolio
- Quick stats: total coverage, annual premium, active policies
- Recent activity feed
- Quick action buttons

### 💰 Insurance Quotes
- Get instant quotes for multiple insurance types:
  - Auto Insurance
  - Home Insurance
  - Life Insurance
  - Health Insurance
- Real-time premium calculation
- Accept quotes to create policies

### 📋 Policy Management
- View all insurance policies
- Organized by status (Active, Pending, Expired)
- Detailed policy information including:
  - Coverage amount
  - Premium details
  - Policy dates
  - Policy numbers

### 🎨 Modern UI/UX
- Responsive design that works on all devices
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Intuitive navigation

## Technology Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Styling**: CSS3 with CSS Variables
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Installsure/installsure-new-build.git
cd installsure-new-build
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
installsure-new-build/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Header.css
│   │   ├── PolicyCard.tsx
│   │   └── PolicyCard.css
│   ├── pages/             # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Quotes.tsx
│   │   └── Policies.tsx
│   ├── store/             # State management
│   │   └── useStore.ts
│   ├── utils/             # Utility functions
│   │   └── helpers.ts
│   ├── App.tsx            # Main app component
│   ├── App.css
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage Guide

### 1. Login
- Enter your name and email on the login page
- Click "Sign In" to access the application

### 2. Get a Quote
- Navigate to "Get Quote" from the header
- Select insurance type (Auto, Home, Life, or Health)
- Choose coverage amount
- Enter age (for Life/Health insurance)
- Click "Calculate Quote" to see your premium
- Accept the quote to create a policy

### 3. View Dashboard
- See all your insurance statistics at a glance
- Monitor active policies and pending quotes
- Access quick actions

### 4. Manage Policies
- Navigate to "My Policies" to view all your insurance policies
- Policies are organized by status
- Each policy card shows detailed information

## Development

### Code Quality

Lint the code:
```bash
npm run lint
```

### Type Checking

TypeScript type checking is integrated into the build process.

## Features in Detail

### Premium Calculation
The application uses a sophisticated algorithm to calculate insurance premiums based on:
- Insurance type
- Coverage amount
- Age (for Life and Health insurance)

### State Management
- Global state managed with Zustand
- Persistent user session
- Efficient state updates

### Responsive Design
- Mobile-first approach
- Breakpoints for tablet and desktop
- Touch-friendly UI elements

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is a demonstration application for insurance management.

## Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using React and TypeScript
