(cat > composer.sh; chmod +x composer.sh; exec bash composer.sh)
#!/bin/bash
set -ev

# Get the current directory.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get the full path to this script.
SOURCE="${DIR}/composer.sh"

# Create a work directory for extracting files into.
WORKDIR="$(pwd)/composer-data"
rm -rf "${WORKDIR}" && mkdir -p "${WORKDIR}"
cd "${WORKDIR}"

# Find the PAYLOAD: marker in this script.
PAYLOAD_LINE=$(grep -a -n '^PAYLOAD:$' "${SOURCE}" | cut -d ':' -f 1)
echo PAYLOAD_LINE=${PAYLOAD_LINE}

# Find and extract the payload in this script.
PAYLOAD_START=$((PAYLOAD_LINE + 1))
echo PAYLOAD_START=${PAYLOAD_START}
tail -n +${PAYLOAD_START} "${SOURCE}" | tar -xzf -

# Pull the latest Docker images from Docker Hub.
docker-compose pull
docker pull hyperledger/fabric-ccenv:x86_64-1.0.0-alpha

# Kill and remove any running Docker containers.
docker-compose -p composer kill
docker-compose -p composer down --remove-orphans

# Kill any other Docker containers.
docker ps -aq | xargs docker rm -f

# Start all Docker containers.
docker-compose -p composer up -d

# Wait for the Docker containers to start and initialize.
sleep 10

# Create the channel on peer0.
docker exec peer0 peer channel create -o orderer0:7050 -c mychannel -f /etc/hyperledger/configtx/mychannel.tx

# Join peer0 to the channel.
docker exec peer0 peer channel join -b mychannel.block

# Fetch the channel block on peer1.
docker exec peer1 peer channel fetch -o orderer0:7050 -c mychannel

# Join peer1 to the channel.
docker exec peer1 peer channel join -b mychannel.block

# Open the playground in a web browser.
case "$(uname)" in 
"Darwin") open http://localhost:8080
          ;;
"Linux")  if [ -n "$BROWSER" ] ; then
	       	        $BROWSER http://localhost:8080
	        elif    which xdg-open > /dev/null ; then
	                xdg-open http://localhost:8080
          elif  	which gnome-open > /dev/null ; then
	                gnome-open http://localhost:8080
          #elif other types blah blah
	        else   
    	            echo "Could not detect web browser to use - please launch Composer Playground URL using your chosen browser ie: <browser executable name> http://localhost:8080 or set your BROWSER variable to the browser launcher in your PATH"
	        fi
          ;;
*)        echo "Playground not launched - this OS is currently not supported "
          ;;
esac

# Exit; this is required as the payload immediately follows.
exit 0
PAYLOAD:
� �!-Y �]is�����
�~y?x�m���6������[)v7AE��5�d�Lb&᝷�gj�n��O��s���d_��2���OR�����I���_PEqCP��w8��F~�pc����V��N��4{��k��P����~�MC{9=��i��>dE\N�Ɖ��e�5�ߖ���.�?�Rѿ���Ǜw���鏒8Uѿ\H��_{�{�j���Z�9�%���}��S���p9�I�"+���k��O'^���r�I�8�"�;z?��{�-��Z���w�O�x��v���C�1�O#��9��`���M����4��됄�{.�P������s3�k;E�(����}�ګ�s�A��Sċ�'���/��/5��	������ؐ՚�}P��	���S�4]h�(�H��&��I����V���l5�M[�Ta&��~ʧ1�<�j���@.6�&h!�S�J�MJO��<�Mt��h�C����@O�{<e��t�����24H���ֶޗ�.��P�Ȗ(z9�����t��
/���=ѿ)~��m/�.]?]��1����0���+E�����׉=x�+�%p����J����uC�d����_������� �9ʚ���d���̐�Ys)n[D� m.W�����4̸PѲ�5K05�!�-sp�x@"�)m�2{8޺�X�8T8�T��u�IY�!kH��:s�� ���"�s����� �D��P59�|�[�G���;�#F�`��"(�r�,D1�`�E��W�e�%���#�(�i*;� t��sh�su�4���6�P�I308׹�`uS��F���c�Gq ~<,]̅�4/��O����xk��X��?�M�'
�~)T(@d���*F����͡]_�w#�L	��0{�nq��V�����Mm@;a���K�*nG(�JK�2qs��3���58O���=!98��#ɓ���/f^ .ԏ����xn,)@�@���#�u���(��EƤ����7+&@fK��(�t isy�1����R�)y��@����u��@.|[$�%���1�e�����}v�7��k�r�-'iKj����Ū��,��Ez ǢϙE/�f�\�}X|`6<[�7g��_���4|����G�J�������6���}���� ��xM���B�;ѝ�ׁzd�7�;u��%�-��=q��%��|�!G�qR�Џ4�%
��F}�B>$��N=��"��U�TA���B���2s��I���:?�2��4]�!�l��b��p��#v�D���[�NuM1GkH���5q"5q1u{W���~�y��W�y.�V�v�
�~����2t����[���˶:U ���	s�0��ax�@�j��i�Y#gh�ˋ*�?���@��O��8^���X{x�gB��Z���C]��;����6%�|�H�9��.A�A�9lQ��QL�f��LH��5>�8�hQ�y��k�_
r���M��X����sS��gr]K���m3�>�P�0Y������k�A����?$Q�����Ϝ�/�����T���@��W�������/��7�^��	�+�_~����S�������~��I���D1�(�-�N�S$[�w���@X$�q��\֡0�\�P��Y������e����G�?NV�_� ��o���~�Ѥ���#��u�u<K�s�G ��e�?�����-ض�`FL�9i��e�l)�z�"��Ɨs�3ܠ��Ȃ�`�͍9�Z�+���u�`5J�`�Y��4��ދ_��ό����K�G�����J���j����������w��ό���)� �?*������+o�������̡�H�>BaJo�vZ����>X���C�a	����>�.to'M�O��q���G&]���dR�M��5�{&h�����Ρ"�1�+�0�C����ٰ�L�[��(�cД(��`Х7(w�j��1<tOj]c�j[<j\�ǈ���^p ?G��qڠy����8�9@z��%�i�V��ڹN�M1|��6Y��.,����μ����´gOM��@�$0A����^��Y��h1	�x�� ��i��=SZ������SMG��v"FR>�9K����Ё��yW 'Y1�������S���������e�C���?��/��_�������o�����`��A*�_
.��+j�E\�����*�_
*�_��J�����w��C�Ƕ �%H�W.��c�^8���`h@��C0���xκ��8�0,���0��(͒$eWQ~�ʠ���M ��W.��S��+��JU,o86'��t�lc�=GZu�-���=yA
/����w�<��i%���䎢�$���x5�`O@��嘱U��v���u{b"�4x6���MF��sJɩ�nV�����?N=?�����(MT������^��,����������B���_&.�?NP������A������r���mE�2���8���/���o)���_��d����j��|
��4B�?��9�m�.cS,���x.����a�G#�n�8K0A��6˰>Zm��2�����?U�?�������Aj�h�(��P�A����0�.���]#M���/���4���v]wW����s)���aDn5f����Q�5#���n��������j=qMP��	ff�^�����/}��G���W
~�%���u������'����K��*��2����W�����V��P
^��j�<�{��΁X�qе
�%,�!?��<�}t�gI �����7����*-û���֍��{�.���@7�Gy���D���=Z����#
'���N1���B�NgĠ��վml�8O`���L�z��"<c8x&'8�d�ub�ysD�������⢹���l�LT0�:����=�m�(����1��!1`[���!�0�BK<����ԕs[�(њ����)�,Ԧϩ��;�t�3r�¼�kԥΈ$������>8�k�����9�ۻ����=��"�v6�8�9g��r����b ��P�0�)��v���K4�[�3ۧwKkUׇ��9^(i��Ń}���8�;����R�[��^��>��P[��%ʠ������JT��K�������� ���5��͝dv�
9���D~���P�'������7��������9�=n�C�j
�����m���䃀$�H���PwSR������ؚ���ms�ѷl���D��!�5S9v-Mhҩl�$��ԺN�t-�\9N�j�x-�4!���A��}�R{���Ț���	�H�6k��y�^wӾ�R󬑬�R��S2���k�g�`�r����߃�N�Ѱ	#$�{Da�6������H��R:����&���R�[�������OI���6��9(�����?~�ge�>���j��������(�ߕ�b�+P}�s)����[w��B�*��T�������s��o��CQ����+���#l�.4��"Y�eh��(�	�	� �]�}�pȀ�� �}�r]�q����V(����?��BR��O)���PZ�d��a�2�f�����9��6ض��"o䑶hQ����hN�m�`]	otw�K��#`����;VaDI�1�ַ����0�k�d=�(G��b(���:�b��W��/v�~Z��ę������?Zp���/�T��U
�~�R�k�/�/��t;u��+T��6r��j������>�Ӆ�;��N�+���c���B��k��^$������2��s'��UM�.�7<�iv��]���^�᧧&q�ξ��/!����:�7����Z6�]�����Q;�w]�*J����t��^}�|h�7:����e�|@�ڕS;��z���ծ��l��&���5|IV��o}���^����Oo�vT�
׾��*��
�+�i��W��m���VWD]�o�*�sӑ���A��~�r}��b��/��hv�oGھ�T�;?X��Z��u�i�]߾ʵ�(��˃���{��{�@�˫�Y>�(K��;0:��bn��X����^~�c�[MZ(��O[/������#����N��;�㷟��w�������{���s�=�����E�����wj���2����'k8�{=��ԅ��z�q���v{D�{�����$,d r�ȏ��Y<g�����G���#��Ⱨi��x8U�"�m.|Wo�&�U�+�7�H��hȊ��أ�*��o�t�?.6��g�^WV�o��t���I��᭝��f	�-���!��>��u[����{\Ut�����3O�����u���p�\υˡ��2f��{�t]�ҡ"]�n;]�ukO׵ۺ���;1AM�	&����?1�OJ�F��|P	4bD!&������l;g�p� ���=]�^����=���{�g�rSn%d"v���D2A�")<]F;�Y#�L&���LG�a\��e혀��I��,/L��p:�ǭ��7�r`��ѱ��b 6t/��5 h��s�3�ۄ�J�ńq!v�E�Q�%I������v��k�&��u#��
�k�Cn��4�0�Rt�kq���3V3EL<�d�v[�t�ԵQ�w����|x�Y����P�����&3ّ鶐-$��[�'�%��*|��H�w�w�8g܄�e���_3�\We�ДF�#!2�R��8�.�F�j�5�w���Bi1^2f^�[��[7gyQc4E��)��F�E�E�e�6��Q�ti&Nm8=�����_�S�;��ɉ����4�b|�\]������iU��=�s�g�w�yN��S�9�uPK�!ˠ�Hҩ��#U��q���YG�S���=�Re�EXs�7#�ˈ�H���׌�����|t�D��8��U���.s�fGW���u�q�]d��SyV��R�6y����U�.r�\�lQ�I�Z;[3o u��j����g��d&/G��O�����g�uT�h��*�7V�x�s.���=��k�n���4m&?�t눅��8/��f��8��ˈ	���91�{�*���v.����7��Z��|WW�%�Ѕ����÷9Z���������3w��T��WU�1�p�i�捣�����#`>��&�m�߭:����F��f��������w?�W��!PX;�qj��?���Z*q�m����<�j �S��ȶ�W�~ԍm{Y�^϶�Zu�� Ώp��r���������g~��c�V3�=��o�_~�k����W(�v+�x��~�׌�����w��^�s�G��U��3�o���87s��' 59cS��xS��~qS�#0��)n^�gq�������"���\���zt��K�x�s��:^��'���Z�����o����.�6�����۰;�(���`� G�~�t�9!"om��Wh3�B��^����\?_%w����|q�G�L=_N�s��[��K����6'�Ka�ȳ�Nw���)%�
G{����4�����b=�DY|"�H��[�(�2�젯d����"R��ճ�%���(W���������\
Jj��жJ�*S,����RS
��z���`���z��̈́���6v&,���2��a�S�z�km�	����-5C��֞�+!�V5���֢隒��� ��U�O2Ii�M��\=.�}-�x��&��\�D�����	�w$�3a2�p��	�CYIf�a�H�����P;�a���O�sȺGxFv�`Y�Nd&h?�U�C��Z-+�]����O�"M�i^�Ɓ�a�4W�4��g���f"X���!�h�����Ϗ1�}��|��%|Lʲd�e�rg6s�)��Rܷé���;���4�
H��#Т��Z�p>�!��,��WB�0VL��&,�)��VZ��++�*hnS�S���V��.����i����LKJ�)��٥�U=x�W�iߐ$�.�[V�4�]�HT�z��&-∩,�a����D��B�*����H�ɔ�B5���b��*.���[�,����_Y�+(K��x�B�
�GI��g�����&���j��v��~%��-�0԰�ƕhQ��ɵ�J�����#1��&��pNY�b�&�܋������r�3e�A�e����ReaB��w��������PR���t��5�r�l�M�}� �o6$u�G$�ZS�ڄ��y
u�P�d�"[� ��ۓ,v�~��}6�g�}��|��S��Ӝ(����ڼ�A�έ]	m@k�)�+6�@�M�J[�<`|]����Sy֡3�y֯��*ͳ�CU�q�.ȶ9��˝6t#t���u55K�np�Py�sPJ�j� �	�܀s��qI�ܸ�D�b
i^k�5��MUu=���[ZG�Z�N���,ɖ�\k�&S�����5�����!g~�aݦ�ꜳЙ�� 0��~� n�<+�*fˡ[��u�k��1U��m���Ĵ��).+z�<8�+���
�9��3�=m �@�e��x�AN�, �j3����r���ou�#7�"/o�Co�C[�-�~)�_
V~)x���{��`�Zx�n��R�T�X!H�pw˳��[xP8��-u$D�RGc��pv4h��F��5�=E�ꂃ�=Np�'���1ݬ)����A�=`� |"���w�Ԧ��I��a#
a�@e�HqKK4�C�G�!$��z/@r^!�E���SʣyݹM��ƕ|��0X�q��ʡ�=8T�x
��{>�G�B�8��Ocb<$��Cv���5I�� �Q�7��w����J1���H��0�K����>�H������RPQ�ٰi�.Ε��5�0������>Ջ	���n���T׺��) �ԡ���L�jZ������ᴍ�6�8�c]�^���m�Sy˔sy���Ǝ�t��ϴb������o��p=t�ʰ��N<,���{���'���?����r_ˎ�}p"i�"����(�+I���U.�D똗`s
d���Gv�T,E�:΃Ճ"�LPdG�LZFA��fMYVz<�-\��C��$01������H2�#b;�qj�@����A�`J�G�.
@��tI��(����rw��(�.�$��	�ha:�7ٍ���v�n�ÄH�-5�vԳ����<9$�J�m�>�|ig p�X������WJU�$/�a�g�B��Q?��]ْ��wxX[�\ �dI^+�K�H��M�Z�D
�.����e�m�o�q(��=�[�)s�)�ɱB�k���
a����V3lb�l���ZKȴ���f�p�?z�aJ|}��+��4^�{�p���?�ǅ� � 6!Z�2Q���w@p�^�{.�j4I'����{X̮W��[���4B�����z��w}饿<��ǡk��@X��v�k���f���\ǁ�OԻw�j�?/K�ǳ���'�ݗ�8��_������M}�ɯ�@���I�{q�T|'��ֵ+�_���=���t�Zڀξ������3_l�N��3NϿ^�ͯ�COB�S�5
�#�i����zs����M����6�Ӧ	�4��i�}�ŵ�v@ڦv��N��i�l���~�v�oy��A�\��g	#�0�M�M^�n[D�d<b��[��:�c��{ȟ�8�6EMx�y�[g��O���T�g`�m����#�.��r�^��f��Ӳ����V{Ό=-��`ϙ���6��0g��}�0�r�̹p�a�C��V�m����c$s���5p�蟝�d';��}���q'�  