import NavBar from '@/components/NavBar';

export default function DashboardGroupLayout({ children }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
