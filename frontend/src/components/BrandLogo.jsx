import React from 'react';
import brandLogo from '../assets/logo1.jpg';

const BrandLogo = ({
  className = 'h-10 w-auto',
  alt = 'DevPortix',
}) => (
  <img
    src={brandLogo}
    alt={alt}
    className={`block object-contain ${className}`}
    loading="eager"
  />
);

export default BrandLogo;
