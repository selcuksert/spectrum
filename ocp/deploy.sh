#!/bin/zsh

scriptPath=${0:a:h}
projectName="spectrum"

# Login with kubeadmin
$(crc console --credentials | grep kubeadmin | awk -F "'" '{print $2}')

# Update scc to enable any user id except root user's
if (! oc get serviceaccount runasnonroot); then
  oc create serviceaccount runasnonroot
  oc adm policy add-scc-to-user nonroot -z runasnonroot --as system:admin
fi

# Update scc to enable any user id
if (! oc get serviceaccount runasroot); then
  oc create serviceaccount runasroot
  oc adm policy add-scc-to-user anyuid -z runasroot --as system:admin
fi

# Login with developer
$(crc console --credentials | grep developer | awk -F "'" '{print $2}')

# Switch to project
oc project $projectName

applyFileList=""

oc delete all -l "app=ui"

oc tag docker.io/rabbitmq:management rabbitmq:management

for fileName in "$scriptPath"/kompose/*.yaml; do
  applyFileList+="$fileName,"
done

oc apply -f "${applyFileList:0:-1}"

function generateApp() {
    appName=$1
    band=$2
    app="$appName$band"

    oc delete all -l "app=$app"
    oc new-app "$appName" \
      --labels="app=$app" \
      --name="$app" \
      --env="BAND=${band:u}" \
      --env='BROKER_HOST=mq' \
      --env='BROKER_PORT=5672' \
      --env='BROKER_PROTOCOL=amqp' \
      --env='TZ=Europe/Istanbul'
    oc patch "deployment/$app" -p '{"metadata":{"labels":{"app.kubernetes.io/part-of": "backend"}}}'
    oc expose service $app
}

generateApp generator mf
generateApp generator hf
generateApp generator vhf
generateApp generator uhf

generateApp processor mf
generateApp processor hf
generateApp processor vhf
generateApp processor uhf

oc new-app ui
oc patch deployment ui -p '{"spec":{"template":{"spec":{"securityContext":{"runAsUser":0},"serviceAccountName":"runasroot"}}}}'
oc expose service ui
oc patch route/ui -p '{"spec":{"port":{"targetPort":8080}}}'