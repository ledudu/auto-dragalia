import { loadingText, retryButtonBlue, retryButtonRed } from '@/images';
import { wait } from '@/utils/wait';

images.requestScreenCapture(false);
const screenCache: {
  image: Image;
  updated: Date;
} = {
  image: images.captureScreen(),
  updated: new Date()
};
export function captureScreenWithCache(maxAge: number = 500): Image {
  const now: Date = new Date();
  if (now.getTime() - screenCache.updated.getTime() > maxAge) {
    screenCache.image = images.captureScreen();
    screenCache.updated = now;
  }

  return screenCache.image;
}

export function tryFindAnyImage({
  images,
  options
}: {
  images: Image[];
  options?: images.FindImageOptions;
}): Point | undefined {
  for (const i of images) {
    const pos: Point | undefined = tryFindImageInScreen(i, options);
    if (pos) {
      return pos;
    }
  }
}

export function tryFindImageInScreen(
  ...args: Parameters<typeof findImageInScreen>
): Point | undefined {
  try {
    return findImageInScreen(...args);
  } catch {
    return;
  }
}

export function findImageInScreen(
  image: Image,
  options?: images.FindImageOptions
): Point {
  const ret: Point | null = images.findImage(
    captureScreenWithCache(),
    image,
    options
  );
  if (ret === null) {
    throw new Error(`未找到图像`);
  }
  console.verbose(`Found image at: ${ret}`);

  return ret;
}

export function clickImage(
  image: Image,
  options?: images.FindImageOptions
): Point {
  const pos: Point = findImageInScreen(image, options);
  click(pos.x, pos.y);

  return pos;
}

export function tryClickImage(image: Image): Point | undefined {
  try {
    return clickImage(image);
  } catch (err) {
    return;
  }
}

export async function waitAndClickImage(
  ...args: Parameters<typeof waitImage>
): Promise<Point> {
  const pos: Point = await waitImage(...args);
  click(pos.x, pos.y);

  return pos;
}

export async function waitImage(
  image: Image,
  options?: IWaitImageOptions
): Promise<Point> {
  const { timeout = 600e3, delay = 500, findOptions = {} } = options || {};

  await wait(delay);
  const startTime: Date = new Date();
  let roundStartTime: Date = startTime;
  while (new Date().getTime() - startTime.getTime() < timeout) {
    tryClickImage(retryButtonRed);
    tryClickImage(retryButtonBlue);
    try {
      return findImageInScreen(image, findOptions);
    } catch {
      console.verbose('Waiting image');
      const now: Date = new Date();
      await wait(delay - (now.getTime() - roundStartTime.getTime()));
      roundStartTime = now;
    }
  }
  throw new Error('等待超时');
}

export async function waitLoading(delay: number = 500): Promise<void> {
  let roundStartTime: Date = new Date();
  while (tryFindImageInScreen(loadingText)) {
    tryClickImage(retryButtonRed);
    tryClickImage(retryButtonBlue);
    const now: Date = new Date();
    await wait(delay - (now.getTime() - roundStartTime.getTime()));
    roundStartTime = now;
  }
}

interface IWaitImageOptions {
  timeout?: number;
  delay?: number;
  findOptions?: images.FindImageOptions;
}
