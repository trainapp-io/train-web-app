export async function enableMocking() {
  if (import.meta.env.MODE === 'development') {
    const { worker } = await import('./browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('🔶 MSW enabled');
  }
}
