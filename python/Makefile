test:
	poetry run pytest -vv

test-unit:
	poetry run pytest -vv -m unit

test-cov:
	poetry run pytest --cov

check:
	poetry run mypy src tests
	poetry run flake8
