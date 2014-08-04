test:
	@node ./bin/_lab -f -m 100
test-cov:
	@node ./bin/_lab -f -t 100 -m 10000
test-cov-html:
	@node ./bin/_lab -f -r html -m 100 -o coverage.html

.PHONY: test test-cov test-cov-html
