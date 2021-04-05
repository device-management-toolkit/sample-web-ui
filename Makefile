cy:
	@read -r -p "Isolate the front end? (y/n): " isolate;\
	read -r -p "Enter the target url: " targetUrl;\
	npm run cypress -- --env ISOLATE=$$isolate,BASEURL=$$targetUrl

runner:
	@read -r -p "Isolate the front end? (y/n): " isolate;\
	read -r -p "Enter the target url: " targetUrl;\
	npm run cy-runner -- --env ISOLATE=$$isolate,BASEURL=$$targetUrl

# container:
# 	docker run -d -p 4200:80 vprodemo.azurecr.ui/samplewebui:latest

# test-container:
# 	docker run -d -p 4201:80 vprodemo.azurecr.ui/samplewebui:latest

#npm run start
