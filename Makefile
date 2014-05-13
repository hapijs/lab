test:
	@node ./bin/lab
test-cov:
	@node ./bin/lab -t 100 -v
test-cov-html:
	@node ./bin/lab -r html -o coverage.html

.PHONY: test test-cov test-cov-html
