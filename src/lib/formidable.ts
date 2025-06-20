import formidable from 'formidable';
import { NextRequest } from 'next/server';

export const parseForm = async (req: NextRequest) => {
  const form = formidable();
  const data = await req.arrayBuffer();
  const buffer = Buffer.from(data);

  return new Promise<{
    fields: formidable.Fields;
    files: formidable.Files;
  }>((resolve, reject) => {
    // Convert NextRequest to Node.js readable stream
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      }
    });

    const nodeStream = ReadableStream.prototype[Symbol.asyncIterator]
      ? readable
      : createReadableStreamAsyncIterator(readable);

    form.parse(nodeStream as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// Helper to create async iterator from ReadableStream if needed
function createReadableStreamAsyncIterator(stream: ReadableStream) {
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const { done, value } = await reader.read();
        if (done) return { done: true, value: undefined };
        return { done: false, value };
      } catch (error) {
        return Promise.reject(error);
      }
    },
    async return() {
      await reader.cancel();
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
