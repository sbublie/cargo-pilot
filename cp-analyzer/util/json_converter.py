import xmltodict
import json

xml = '''
'''

# Remove namespace annotations from XML
xml_without_ns = xml.replace('ns4:', '')
xml_without_ns = xml_without_ns.replace('env:', '')

# Convert XML to OrderedDict
data_dict = xmltodict.parse(xml_without_ns)

# Convert OrderedDict to JSON
json_data = json.dumps(data_dict, indent=4)

# Print the JSON data
entity = data_dict['Envelope']['Body']['FindCargoOffersResponse']['payload']['entity'][4]
print(json.dumps(entity, indent=4))