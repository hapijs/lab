test:
	@node ./bin/_lab -f
test-cov:
	@node ./bin/_lab -f -t 100
test-cov-html:
	@node ./bin/_lab -f -r html -o coverage.html

.PHONY: test test-cov test-cov-html
