import React from 'react';
const paths={
grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
activity:<><path d="M3 12h4l2.2-7 4.2 14 2.2-7H21"/></>,
users:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
calendar:<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
trophy:<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4"/></>,
menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
refresh:<><path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11"/><path d="M3 4v7h7M4 13a8.1 8.1 0 0 0 14.8 3L21 13"/><path d="M21 20v-7h-7"/></>,
plus:<><path d="M12 5v14M5 12h14"/></>,
close:<><path d="m6 6 12 12M18 6 6 18"/></>,
arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>,
check:<path d="m5 12 4 4L19 6"/>
};
export default function Icon({name,size=18,strokeWidth=1.8}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.grid}</svg>;}