import './globals.css';

export const metadata = {
  title: 'Habibi Official — Admin Dashboard',
  description: 'Premium admin dashboard for the Habibi Official API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
