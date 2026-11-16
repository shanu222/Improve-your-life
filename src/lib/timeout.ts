export async function withTimeout<T>(work: Promise<T>, ms: number, label = 'This is taking too long.'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function settleWithTimeout(work: Promise<unknown>, ms: number): Promise<void> {
  try {
    await withTimeout(work, ms);
  } catch {
    /* never block sign-out or delete on a hung network call */
  }
}
