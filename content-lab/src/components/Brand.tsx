/** Frame the icon in the supplied artwork without changing its original proportions. */
export function BrandIcon({ className = "" }: { className?: string }) {
  return <svg className={`lens-brand-icon ${className}`} viewBox="325 185 565 575" aria-hidden="true" focusable="false"><image href={`${import.meta.env.BASE_URL}brand/ceptlens-original.webp`} width="1254" height="1254" /></svg>;
}

export function Brand() {
  return <><BrandIcon /><span className="brand-copy"><strong>Cept<span>Lens</span></strong></span></>;
}
