# Miminal auditing service for dojot

This contains the implementation for a minimalistic auditing/monitoring service for dojot APIs,
built using express and mongodb.

For this to work, kong's [HTTP log plugin](https://getkong.org/plugins/http-log/) has to be
enabled for the APIs that are to be monitored.

To enable the plugin for a given api:

```shell
# ${kong} is the base url for the kong management API (e.g. http://apigw:8001 )
# ${endpoint} is the API name or id, when configured into kong
# This assumes the service is accessible by kong on host 'audit'
curl -o /dev/null -sS -X POST ${kong}/apis/${endpoint}/plugins \
     -d "name=http-log" \
     -d "config.http_endpoint=http://audit/audit/api/trail" \
     -d "config.method=POST"

```

## Build container

To build the service container:

```shell
# At project root
docker build -t <tag> -f Dockerfile .
```

## Running along dojot

If dojot is being run using [docker-compose](http://dojotdocs.readthedocs.io/en/latest/install/compose_guide.html),
you may just spin this up on the same container network:

```shell
# ${tag} is the tag used when the container was built
docker run --rm -it -v $PWD:/dojot-audit \
           --network ${project}_default \
           --network-alias audit \
           ${tag}
```
