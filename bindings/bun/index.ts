import { dlopen, FFIType } from "bun:ffi";
import { Socket, Server } from "node:net";

const libPath = "../../build/libancillaire.so";

const {
  symbols: {
    ancillaire_version,
    ancillaire_send_fd,
    ancillaire_recv_fd,
  },
} = dlopen(
  libPath,
  {
    ancillaire_version: { args: [], returns: FFIType.cstring },
    ancillaire_send_fd: {
      args: [FFIType.i32, FFIType.i32],
      returns: FFIType.i32,
    },
    ancillaire_recv_fd: { args: [FFIType.i32], returns: FFIType.i32 },
  },
);

function version(): string {
  return ancillaire_version().toString();
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

if (false) {
  const socketPath = "/tmp/wayplain-0";
  const socket = new Socket().connect(socketPath);

  // there is no way to access the file descriptor as of now
  const HIGHLY_UNSTABLE_SOCKET_FD = 13;
  const STDOUT_FD = 1;

  sendFd(HIGHLY_UNSTABLE_SOCKET_FD, STDOUT_FD);
} else {
  const socketPath = "/tmp/wayplain-0";
  const socket = new Server().listen(socketPath);

  // there is no way to access the file descriptor as of now
  const HIGHLY_UNSTABLE_SOCKET_FD = 14;

  socket.on('connection', async () => {
    const fd = recvFd(HIGHLY_UNSTABLE_SOCKET_FD);

    const file = Bun.file(fd);

    const encoder = new TextEncoder();
    const data = encoder.encode("datadatadata"); 

    await Bun.write(file, data);
    
  });
}
