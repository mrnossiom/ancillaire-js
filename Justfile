# Just is not a build system but works fine for our usecase

_default:
	@just --list --unsorted --list-heading '' --list-prefix '—— '

cflags := "-Wall -Wextra -Wvla -pedantic"
cdebug_flags := "-g -fsanitize=address"

buildc:
    mkdir -p build
    cc -c {{cflags}} -o build/libancillaire.o src/ancillaire.c
    cc -shared -o build/libancillaire.so build/libancillaire.o

clean:
	rm -rd build
