import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function PagesIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/(pages)/(discover)');
  }, []);
  
  return null; // Don't render anything while redirecting
}