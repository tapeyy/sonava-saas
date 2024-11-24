import Image from 'next/image';

import logowhite from '@/public/assets/images/logo-black-on-white.png';

export const Logo = () => (
  <div className="flex items-center text-xl font-semibold">
    <Image src={logowhite} alt="Logo" width={100} height={100} />
  </div>
);
