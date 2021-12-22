  #!/bin/zsh

scriptPath=${0:a:h}
projectName="spectrum"

function buildImage() {
  imageName=$1
  buildPath=$2
  imageTag=$3
  buildName="$imageName-$imageTag"

  oc delete all -l "build=$buildName" &&
    oc new-build --strategy docker --binary --name "$buildName" --to "$imageName:$imageTag" &&
    oc start-build "$buildName" --from-dir "$buildPath" --follow --wait
}

# Login with developer
$(crc console --credentials | grep developer | awk -F "'" '{print $2}')

# Add new project
if (! oc get project $projectName); then
  oc new-project $projectName
fi

oc project $projectName

# Cleanup
oc delete all -l "io.kompose.service"
oc delete pvc -l "io.kompose.service"

# Build UI
buildImage ui "$scriptPath/../ui" latest

# Build backends
# generator
oc delete all -l "build=generator"
cp -R "$scriptPath/../app/generator" "$scriptPath/build" && \
cp -R "$scriptPath/../app/common" "$scriptPath/build/"
sed -i '' 's/..\/common/.\/common/g' "$scriptPath/build/app.js"
oc new-build nodejs --binary --name generator --to generator:latest
oc start-build generator --from-dir="$scriptPath/build" --wait
rm -rf "$scriptPath/build"

# processor
oc delete all -l "build=processor"
cp -R "$scriptPath/../app/processor" "$scriptPath/build" && \
cp -R "$scriptPath/../app/common" "$scriptPath/build/"
sed -i '' 's/..\/common/.\/common/g' "$scriptPath/build/app.js"
oc new-build nodejs --binary --name processor --to processor:latest
oc start-build processor --from-dir="$scriptPath/build" --wait
rm -rf "$scriptPath/build"
