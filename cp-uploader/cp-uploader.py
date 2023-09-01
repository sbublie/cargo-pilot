from input_converter import InputConverter
from env import SHOW_PROMPT
from api_handler import APIHandler

import json
import inquirer

def main():

    if SHOW_PROMPT:
        # Show propt that asks the user for the filename and also checks if the file is existing
        questions = [
            inquirer.List(
                "instance",
                message="Do you want to upload to a local or online instance?",
                choices=["Local", "Online"],
            ),
            inquirer.List(
                "data_type",
                message="What type of data do you want to upload?",
                choices=["Trips", "Offerings"],
            ),
            inquirer.List(
                "source",
                message="What is the source of the data?",
                choices=["Transics", "DB"],
            ),
            inquirer.Path('file',
                          message="Enter the file name",
                          path_type=inquirer.Path.FILE,
                          exists=True),
        ]
        answers = inquirer.prompt(questions)
        # Convert the file to the internal data model

        processed_data = None
        if answers["source"] == "Transics":
            processed_data = InputConverter().process_transics_file(filename=answers["file"])

        if answers["source"] == "DB":
            processed_data = InputConverter().process_db_file(filename=answers["file"])

        if processed_data:
            data = json.dumps(processed_data)
            if answers['Trips']:
                APIHandler().upload_trips(data)
            if answers['Offerings']:
                APIHandler().upload_offerings(data)
    else:
        # TODO: Delete manual option for Prod
        data = json.dumps(InputConverter().process_file(filename="20230706_05Jan.csv", source="Transics"))
        APIHandler().upload_data(data)


if __name__ == "__main__":
    main()
