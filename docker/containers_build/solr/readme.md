# Solr CN

* ik-analyzer 7 https://blog.csdn.net/IPI715718/article/details/88933851
* ik-analyzer 8 https://www.lastupdate.net/19698.html
* ik-analyzer 5 https://juejin.cn/post/6844903873178501133


* https://github.com/docker-solr/docker-solr
* https://hub.docker.com/_/solr

## command 

```bash
# build solr image with chinese support
docker build -t solrcn .

# run container
docker run -d -v "$PWD/solrdata:/var/solr" -p 8983:8983 --name my_solr solrcn solr-precreate gettingstarted

docker exec -it my_solr /bin/bash

# create new core
solr create_core -c
```


## XML

### managed-schema

```xml

<fieldType name="text_ik" class="solr.TextField">
  <analyzer type="index">
	  <tokenizer class="org.wltea.analyzer.lucene.IKTokenizerFactory" useSmart="false" conf="ik.conf"/>
	  <filter class="solr.LowerCaseFilterFactory"/>
  </analyzer>
  <analyzer type="query">
	  <tokenizer class="org.wltea.analyzer.lucene.IKTokenizerFactory" useSmart="true" conf="ik.conf"/>
	  <filter class="solr.LowerCaseFilterFactory"/>
  </analyzer>
</fieldType>

<!--
<fieldType name="text_cn" class="solr.TextField">
  <analyzer type="index">
	  <tokenizer class="org.apache.lucene.analysis.cn.smart.HMMChineseTokenizerFactory"/>
  </analyzer>
  <analyzer type="query">
	  <tokenizer class="org.apache.lucene.analysis.cn.smart.HMMChineseTokenizerFactory"/>
  </analyzer>
</fieldType>
-->


```

### my-data-config.xml

```xml

<?xml version="1.0" encoding="UTF-8" ?>
<dataConfig>
    <dataSource type="JdbcDataSource" driver="com.mysql.jdbc.Driver" url="jdbc:mysql://localhost:3306/solr_test"
                user="root" password=""/>
    <document>
        <entity name="user" query="select * from user">
            <field column="id" name="id"/>
            <field column="age" name="age"/>
            <field column="name" name="name"/>
            <field column="hobby" name="hobby"/>
        </entity>
    </document>
</dataConfig>
```


### solrconfig.xml

```xml
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
	<lst name="defaults">
		<str name="config">my-data-config.xml</str>
	</lst>
</requestHandler>

```

```xml
<lib dir="${solr.install.dir:../../../..}/dist/" regex="mysql-connector-java-.*\.jar" />
```
