import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(()=>{cleanup();vi.restoreAllMocks();sessionStorage.clear();document.body.style.overflow='';});
Object.defineProperty(window,'matchMedia',{writable:true,value:vi.fn((query:string)=>({matches:query.includes('reduced-motion: reduce'),media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
class Observer {observe(){} unobserve(){} disconnect(){}}
vi.stubGlobal('IntersectionObserver',Observer);
vi.stubGlobal('ResizeObserver',Observer);
