// Preview reads must see either the old library or the fully committed library.
// Mutations are already serialized by the host's publishing lock.
export function createPreviewBoundary() {
  let barrier = null;
  let open;
  let readers = 0;
  let drained;
  return {
    async enterRead() {
      while (barrier) await barrier;
      readers++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        if (--readers === 0) drained?.();
      };
    },
    async beginWrite() {
      if (barrier) throw new Error("Preview commit already active");
      barrier = new Promise(resolve => { open = resolve; });
      if (readers) await new Promise(resolve => { drained = resolve; });
      let released = false;
      return () => {
        if (released) return;
        released = true;
        drained = undefined;
        barrier = null;
        open();
      };
    },
  };
}
