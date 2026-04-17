const url = process.env.NEXT_PUBLIC_API_URL;

if (!url) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the dev server."
  );
}

export const API_URL: string = url;