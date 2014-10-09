test:
	@node ./bin/_lab -fL -m 3000
test-cov:
	@node ./bin/_lab -fL -t 100 -m 3000
test-cov-html:
	@node ./bin/_lab -fL -r html -m 3000 -o coverage.html

.PHONY: test test-cov test-cov-html
