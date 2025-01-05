import { useTranslations } from 'next-intl';
import React from 'react';

import { Card } from '@/components/ui/card';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <Card className="mt-6">
        <h1 className="text-2xl font-semibold">Services</h1>

        <div className="mt-4 flex w-full items-center justify-start space-x-4">
          <a href="service/labelgenerator" className="w-full max-w-screen-sm text-blue-500">
            <Card className="mt-6 flex justify-between">
              MCC Label Generator
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="10" fill="#10B981" />
              </svg>
            </Card>
          </a>
        </div>
      </Card>
    </>
  );
};

export default DashboardIndexPage;
