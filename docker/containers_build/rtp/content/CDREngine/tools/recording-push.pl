#!/usr/bin/perl -w
#========================================================================== -*-Perl-*-
#
# !!! Push Recording to remote WS !!!
#
# DESCRIPTION
#
#   Daemon Accounting Extension
#
# AUTHOR
#   Danilo Santoro <dsantoro@tecnonetspa.it>
#
# COPYRIGHT
#   Copyright (C) 2016 Danilo 'Parantido' Santoro 
#
# REVISION
#   $Id: recording-push.pl
#
#=====================================================================================
use warnings;

use utf8;
use JSON;
use POSIX;
use MIME::Base64;
use LWP::UserAgent;
use File::Basename;
use URL::Encode qw/url_decode_utf8/;

# Set Debug Log Path
my $debug_log = "/var/log/CDREngine/recoding_push.log";
my $n_args = $#ARGV + 1;

# Retrieve Local absolute path
my $dirname = `which dirname`;
exit(1) if not $dirname;
chomp($dirname);

# Local Script Path
my $local_dir = dirname(__FILE__);

# Create log pathname if does not exists
if(defined $debug_log) {
	if($debug_log =~ /^(.*)\/[^\/]+\.log$/) {
		if (-e $1) {
		} else {
			mkdir $1 or die "[ERROR] Error creating log path directory: $1";
		}
	} else {
		die "[ERROR] Invalid log path name: $debug_log";
	}
}

if($n_args lt 2) {
	printf("[ee] Expecting recording pathname\n");
	exit 1;
}

# Open Debug file
open DEBUG, '>>'.$debug_log if(defined $debug_log);

sub encode_base64url{
	my($data) = @_;
	return 0 unless $data;
	$data = encode_base64($data);
	#$data =~ s/\+/-/g;
	#$data =~ s/\//_/g;
	#$data =~ s/\=//g;
	#$data =~ s/\n//g;
	$data =~ s/[ ]/+/g;
	return($data);
}

sub getJsonConfigKey {
	my $cfg = shift;
	my $key = shift;

	my @parts = split '/', $key;
	my $lastPart = pop @parts;
	open my $fh, '<', $cfg or die "Unable to open config file ($cfg): $!";
	my $raw = do {
		local $/;
		<$fh>;
	};
	close $fh;
	my $data = JSON->new->relaxed(1)->decode($raw);
	my $directive = $data;
	for my $part (@parts) {
		$directive = $directive->{$part};
	}
	return $directive->{$lastPart};
}

sub upload2WS() {
	my $url = shift;
	my $c_type = shift;
	my $payload = shift;

	my $ua = LWP::UserAgent->new;
	$ua->timeout(5);
	$ua->agent("CDREngine/0.1");

	# Getting log time -- debug
	my $log_time = strftime("%Y-%m-%d %H:%M:%S", localtime);
	# print       "$log_time -> [INFO    | CDREngine::Accounting::storeAccLine] Sending content: cdr=$payload to $url\n";
	print DEBUG "$log_time -> [INFO    | CDREngine::Accounting::storeAccLine] Sending content: cdr=$payload to $url\n" if defined $debug_log;

	my $req = HTTP::Request->new(POST => $url);
	$req->content_type($c_type);
	$req->content($payload);

	# Doing request
	my $res = $ua->request($req);

	# Updating log time -- debug
	$log_time = strftime("%Y-%m-%d %H:%M:%S", localtime);

	# Storing code and content
	my $status = $res->code;
	my $content = $res->content;

	if ($res->is_error) {
		# Handle Timeout
		if ($status == HTTP::Status::HTTP_REQUEST_TIMEOUT) {
			print       "$log_time -> [TIMEOUT | CDREngine::Accounting::storeAccLine] CDR Record timed out for $host: ($status), $content\n";
			print DEBUG "$log_time -> [TIMEOUT | CDREngine::Accounting::storeAccLine] CDR Record timed out for $host: ($status), $content\n" if defined $debug_log;
			return -1;
		} else {
			print       "$log_time -> [ERROR_H | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n";
			print DEBUG "$log_time -> [ERROR_H | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n" if defined $debug_log;
			return 0;
		}
	} else {
		if($status =~ /20[0-9]/) {
			print       "$log_time -> [SUCCESS | CDREngine::Accounting::storeAccLine] CDR Record correctly stored: ($status), $content\n";
			print DEBUG "$log_time -> [SUCCESS | CDREngine::Accounting::storeAccLine] CDR Record correctly stored: ($status), $content\n" if defined $debug_log;
			return 1;
		# TODO - don't know if this can really happens
		# leaving for safety
		} else {
			print       "$log_time -> [ERROR_R | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n";
			print DEBUG "$log_time -> [ERROR_R | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n" if defined $debug_log;
			return 0;
		}
	}
}

my $recording = $ARGV[0];
my $rec_name  = $ARGV[1];

my ($ext)   = $rec_name =~ /(\.[ao]\.[^.]+)$/;
die("[ee] unspupported file!\n") if(not defined $ext);
my ($fname) = $rec_name =~ /(.*)$ext$/;

# Track down basedir
my $basedir = undef;

# Answer side should be latest filte created
# Offer should already be there
if($ext eq ".a.rtp") {
	# Get Base Recording Path
	$basedir = `$dirname $recording`;
	chomp($basedir);

	# Some useful debug
	print DEBUG "\n[ii] ------------------- NEW RECORDING ------------------ \n" if defined $debug_log;
	print DEBUG "[ii] Base dir: $basedir, Recording: $recording, Rec.Name: $rec_name, File name: $fname, Extension: $ext \n" if defined $debug_log;

	# Extract audio from answer and offer rtp file
	my $convert_a=`/usr/local/bin/extractaudio -F wav -B "$basedir/$fname.a.rtp" "$basedir/$fname.a.wav"`;
	my $convert_o=`/usr/local/bin/extractaudio -F wav -B "$basedir/$fname.o.rtp" "$basedir/$fname.o.wav"`;

	# Some useful debug again
	print DEBUG "\n[ii] $rec_name (ext: $ext) audio EXTRACTION\n\nAnswer status:\n$convert_a\nOffer status:\n$convert_o" if defined $debug_log;
	if($? == 0) {
		# Mixing down answer and offer togheter
		my $mixdown=`/usr/bin/sox -m "$basedir/$fname.a.wav" "$basedir/$fname.o.wav" "$basedir/$fname.wav"`;
		# Another useful debug
		print DEBUG "[ii] Mixing down '$basedir/$fname.a.wav' and '$basedir/$fname.o.wav' to '$basedir/$fname.wav' -> Status:\n$mixdown\n" if defined $debug_log;
		# Resample Mixdown to MP3
		my $resample=`/usr/bin/sox "$basedir/$fname.wav" "$basedir/$fname.mp3" rate 16k`;
		# Yet Another useful debug
		print DEBUG "[ii] /usr/bin/sox \"$basedir/$fname.wav\" \"$basedir/$fname.mp3\" rate 16k\n" if defined $debug_log;
		print DEBUG "[ii] Resampling '$basedir/$fname.wav' to '$basedir/$fname.mp3' -> Status:\n$resample\n" if defined $debug_log;
		# Pointing to extracted audio
		$recording = "$basedir/$fname.mp3";
		$rec_name = "$fname.mp3";
	} else {
		printf("[ee] Error converting $rec_name to a mp3 file!\n");
		print DEBUG "[ee] Error converting $rec_name to a mp3 file!\n" if defined $debug_log;
		exit 1;
	}
} else {
	printf("[ww] $rec_name is not a rtp ($ext) audio file, ignoring it!\n");
	print DEBUG "[ww] $rec_name is not a rtp ($ext) audio file, ignoring it!\n" if defined $debug_log;
	exit 1;
}

($ext) = $rec_name =~ /(\.[^.]+)$/;
if($ext ne ".mp3") {
	printf("[ww] $rec_name is not a mp3 ($ext) audio file, ignoring it!\n");
	print DEBUG "[ww] $rec_name is not a mp3 ($ext) audio file, ignoring it!\n" if defined $debug_log;
	exit 1;
}

my ($callid, $garbage) = split(/=/, $rec_name);
printf("[ii] Got $rec_name at $recording with Call Id: $callid\n");
print DEBUG "[ii] Got $rec_name at $recording with Call Id: $callid\n" if defined $debug_log;

if(not -e $recording) {
	printf("[ee] Recording does not exists\n");
	print DEBUG "[ee] Recording does not exists\n" if defined $debug_log;
	exit 1;
}

unless(open INPUT, '<', $recording) {
	print DEBUG "[ee] Unable to open recording file '$recording'\n" if defined $debug_log;
	die "[ee] Unable to open recording file '$recording'\n";
}

# Read the input file.
# my $rec_content = do { local $/; <INPUT> };
local($/) = undef;
my $rec_content = "data:audio/mp3;base64," .encode_base64url(<INPUT>);

# Close file
close INPUT;

# Debug
print DEBUG "[ii] $rec_name content correctly encoded!\n" if defined $debug_log;

# Get WAV Info
use Audio::Scan;
my $info = Audio::Scan->scan_info($recording);

# Create new recording payload
my %cdr_recording = ();
$cdr_recording{'name'} = url_decode_utf8($callid);
$cdr_recording{'content'} = $rec_content;
$cdr_recording{'tags'} = '';
$cdr_recording{'timestamp'} = localtime(time);
$cdr_recording{'duration'} = $info->{info}->{song_length_ms};
$cdr_recording{'visible'} = 1; 

# Convert Hash to JSON String
my $json = encode_json { recording => \%cdr_recording };

# Retrieve hosts from Config File
my $cfg = $local_dir. "/../config/cdrengine.conf";
my @upload_uris = &getJsonConfigKey($cfg, 'recording_upload_uris');
my @replication_uris = &getJsonConfigKey($cfg, 'recording_replication_uris');

# Debug
print DEBUG "[ii] Sending $rec_name to WS!\n" if defined $debug_log;

# Iterate through all upload uri for 
# first available
my $hosts = shift(@upload_uris);
foreach my $host (@$hosts) {
	# Debug
	printf("Sending to upload host: %s\n", $host);
	# Do not iterate through upload uris if correcty
	# CDR record got correctly stored to actual host.
	last if(&upload2WS($host, 'application/json', $json) gt 0);
}

# Backup record to all available
# replication hosts
$hosts = shift(@replication_uris);
foreach my $host (@$hosts) {
	# Debug
	printf("Sending to replication host: %s\n", $host);
	&upload2WS($host, 'application/json', $json);
}

# Debug
print DEBUG "[ii] ------------------- END RECORDING ------------------ \n" if defined $debug_log;
close DEBUG if defined $debug_log;
