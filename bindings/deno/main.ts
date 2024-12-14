const libPath = "../../build/libancillaire.so";

const {
  symbols: {
    ancillaire_version,
    ancillaire_send_fd,
    ancillaire_recv_fd,
  },
} = Deno.dlopen(
  libPath,
  {
    ancillaire_version: {
      parameters: [],
      result: "pointer",
    },
    ancillaire_send_fd: { parameters: ["i32", "i32"], result: "i32" },
    ancillaire_recv_fd: { parameters: ["i32"], result: "i32" },
  } as const,
);

function version(): string {
  const versionPtr = ancillaire_version();
  if (versionPtr == null) throw new Error("got null pointer from ancillaire_version");
  return new Deno.UnsafePointerView(versionPtr).getCString();
}

function sendFd(socket_fd: number, fd: number) {
  const result = ancillaire_send_fd(socket_fd, fd);
  if (result < 0) throw new Error(`got errno error from ancillaire_send_fd: ${-result}`);
}

function recvFd(socket_fd: number): number {
  const result = ancillaire_recv_fd(socket_fd);
  if (result < 0) throw new Error(`got errno error from ancillaire_send_fd: ${-result}`);

  return result;
}

// ---

console.log(`> using ${version()}`);

const socketPath = "/tmp/wayplain-0";
const listener = await Deno.connect({ path: socketPath, transport: "unix" })

// there is no way to access the file descriptor as of now

const HIGHLY_UNSTABLE_SOCKET_FD = 21;
const STDOUT_FD = 1;

ancillaire_send_fd(HIGHLY_UNSTABLE_SOCKET_FD, STDOUT_FD);
