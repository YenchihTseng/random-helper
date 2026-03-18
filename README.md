# React Vite Project

This is a React project bootstrapped with Vite. 

## Prerequisites

- **Node.js**: v20 or higher is required (Vite 6 requires Node v18/20/22+).

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

A GitHub Action is included in `.github/workflows/deploy.yml` that automatically deploys the `main` branch to GitHub Pages.

To enable this on GitHub:
1. Go to your repository settings on GitHub.
2. Navigate to **Pages** > **Build and deployment**.
3. Change **Source** to **GitHub Actions**.
4. Push your code to the `main` branch.
