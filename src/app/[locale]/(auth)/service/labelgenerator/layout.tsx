// app/services/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

// List of allowed organizations (replace with actual organization IDs)
const allowedOrganizations = ['org_2pHjYjTOot943auVGUVA2vQJxXi', 'org_2pHKdpxlmI3e95Jb5CdGk3l6tj0'];

const Layout = async ({ children }: { children: ReactNode }) => {
  const { userId, orgId } = await auth();

  // If the user is not authenticated, redirect to sign-in page
  if (!userId) {
    return redirect('/sign-in'); // Redirect to sign-in page if not authenticated
  }

  // If the user is authenticated but not part of an allowed organization, show a forbidden page
  if (!orgId || !allowedOrganizations.includes(orgId)) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You are not part of an authorized organization to access this service.</p>
      </div>
    );
  }

  // If authenticated and authorized, render the children (the page content)
  return <>{children}</>;
};

export default Layout;
