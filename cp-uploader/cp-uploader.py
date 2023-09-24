import inquirer
import os

from env import SHOW_PROMPT
from input_converter import InputConverter
from api_handler import APIHandler

input_folder_path = "input"
file_names = os.listdir(input_folder_path)


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
            inquirer.List(
                "file",
                message="Select a file",
                choices=file_names,
            ),
        ]
        answers = inquirer.prompt(questions)

        file_path = f"{input_folder_path}/{answers['file']}"

        processed_data = InputConverter().convert_data_from_file(
            filename=file_path,
            source=answers["source"],
            data_type=answers["data_type"],
            instance=answers["instance"])
        APIHandler().upload_data(data=processed_data, data_type=answers["data_type"], instance=answers["instance"])


if __name__ == "__main__":
    main()
