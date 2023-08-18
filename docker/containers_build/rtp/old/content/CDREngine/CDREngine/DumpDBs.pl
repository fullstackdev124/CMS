use Fcntl;
use DB_File;
use Data::Dumper;

################
# DUMP PRV DBD #
################

tie %ipcdb, 'DB_File', '/tmp/.ipcDb', O_RDWR, 0640 or die $!;
printf("################################################# IPC DataBase #################################################\n");
print Data::Dumper->Dump([\%ipcdb],['IPC']);
printf("############################################### END IPC DataBase ###############################################\n\n\n");
untie %ipcdb;

################
# DUMP ADM DBD #
################

tie %cdrsdb, 'DB_File', '/tmp/.cdrsDb', O_RDWR, 0640 or die $!;
printf("################################################ CDRS DataBase #################################################\n");
print Data::Dumper->Dump([\%cdrsdb],['CDRs']);
printf("############################################## END CDRS DataBase ###############################################\n\n\n");
untie %cdrsdb;
