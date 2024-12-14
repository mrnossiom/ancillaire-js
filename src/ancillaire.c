#include <assert.h>
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/un.h>
#include <unistd.h>

#include "ancillaire.h"

char *ancillaire_version(void) { return "libancillaire v0.0.0"; }

int ancillaire_send_fd(int socket_fd, int fd) {
  // message needs dummy data
  int data = 0xDEADBEEF;
  struct iovec iov = {
      .iov_base = &data,
      .iov_len = sizeof(data),
  };

  // correctly align message
  union {
    char buf[CMSG_SPACE(sizeof(int))];
    struct cmsghdr align;
  } control_msg;

  struct msghdr msgh = {
      // no need for a name for ipc
      .msg_name = NULL,
      .msg_namelen = 0,

      .msg_iov = &iov,
      .msg_iovlen = 1,

      .msg_control = control_msg.buf,
      .msg_controllen = sizeof(control_msg.buf),
  };

  // build control message to pass through ancillaire data
  // contains a fd
  struct cmsghdr *cmsgp;
  cmsgp = CMSG_FIRSTHDR(&msgh);
  cmsgp->cmsg_level = SOL_SOCKET;
  cmsgp->cmsg_type = SCM_RIGHTS;
  cmsgp->cmsg_len = CMSG_LEN(sizeof(int));
  memcpy(CMSG_DATA(cmsgp), &fd, sizeof(int));

  if (sendmsg(socket_fd, &msgh, 0) == -1)
    return -errno;

  return 0;
}

int ancillaire_recv_fd(int socket_fd) {
  int data;
  int fd;

  struct iovec iov = {
      .iov_base = &data,
      .iov_len = sizeof(int),
  };

  struct msghdr msgh = {
      .msg_name = NULL,
      .msg_namelen = 0,

      .msg_iov = &iov,
      .msg_iovlen = 1,
  };

  union {
    char buf[CMSG_SPACE(sizeof(int))];
    struct cmsghdr align;
  } control_msg;
  struct cmsghdr *cmsgp;

  msgh.msg_control = control_msg.buf;
  msgh.msg_controllen = sizeof(control_msg.buf);

  if (recvmsg(socket_fd, &msgh, 0) == -1)
    return -errno;

  cmsgp = CMSG_FIRSTHDR(&msgh);
  assert(cmsgp->cmsg_len == CMSG_LEN(sizeof(int)));

  if (cmsgp == NULL || cmsgp->cmsg_len != CMSG_LEN(sizeof(int)) ||
      cmsgp->cmsg_level != SOL_SOCKET || cmsgp->cmsg_type != SCM_RIGHTS) {
    errno = EINVAL;
    return -132;
  }

  memcpy(&fd, CMSG_DATA(cmsgp), sizeof(int));
  return fd;
}
