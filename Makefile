test:
	@node ./bin/_lab -f -m 1000
test-cov:
	@node ./bin/_lab -f -t 100 -m 1000
test-cov-html:
	@node ./bin/_lab -f -r html -m 1000 -o coverage.html

.PHONY: test test-cov test-cov-html
