FROM solr:8.5.2

# copy lib
COPY lib8/ik-analyzer-8.3.0.jar /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY lib8/solr-dataimporthandler-8.4.0.jar /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY lib8/ik-analyzer-solr7-7.x.jar /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY lib8/solr-dataimporthandler-extras-8.4.0.jar /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY db-connect/mysql-connector-java-8.0.23.jar /opt/solr-8.5.2/dist



# copy dic
COPY dics/lib5_ext.dic /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY dics/lib5_ext_stopword.dic /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY dics/lib7_ext.dic /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib
COPY dics/lib7_ext_stopword.dic /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib


# copy config xml
COPY dics/IKAnalyzer.cfg.xml /opt/solr-8.5.2/server/solr-webapp/webapp/WEB-INF/lib