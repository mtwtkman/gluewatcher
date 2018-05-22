.PHONY: init
init:
	python3 -m venv v && ./v/bin/pip install -r requirements.txt

.PHONY: run
run:
	./v/bin/python server.py
