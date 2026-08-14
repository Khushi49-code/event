// components/ChatbotController.tsx
"use client";

import { usePathname } from 'next/navigation';
import SupportChatbot from './SupportChatbot';

export default function ChatbotController() {
  const pathname = usePathname();
  
  // જે પેજો પર ચેટબોટ ના બતાવવો
  const hiddenPaths = ['/login', '/invitation', '/invite', '/auth/login'];
  
  // ચેક કરો કે શું પાથ hiddenPaths માં છે
  const shouldHideChatbot = hiddenPaths.some(path => pathname?.startsWith(path));
  
  if (shouldHideChatbot) {
    return null;
  }
  
  return <SupportChatbot />;
}