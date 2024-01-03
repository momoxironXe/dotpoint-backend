# If the directory, `dist`, doesn't exist, create `dist`
stat build || mkdir build
# Archive artifacts
# cd build
zip build/dotpoint.zip -r build package.json config .platform .env .npmrc yarn.lock .ebextensions global.d.ts node_modules